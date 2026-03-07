package com.spc.spc_back.dto.spcdata;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.spc.spc_back.entity.spcdata.Characteristic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CharacteristicAddReqDto {
    @NotBlank(message = "charNo is required.")
    private String charNo;

    private String axis;

    @NotNull(message = "nominal is required.")
    private Double nominal;

    @NotNull(message = "uTol is required.")
    @JsonProperty("uTol")
    private Double uTol;

    @NotNull(message = "lTol is required.")
    @JsonProperty("lTol")
    private Double lTol;

    public Characteristic toEntity(Long projId) {
        Characteristic characteristic = new Characteristic();
        characteristic.setProjId(projId);
        characteristic.setCharNo(charNo);
        characteristic.setAxis(axis);
        characteristic.setNominal(nominal);
        characteristic.setUTol(uTol);
        characteristic.setLTol(lTol);
        return characteristic;
    }

    public static List<Characteristic> toList(
            List<CharacteristicAddReqDto> characteristicReqDtoList,
            Long projId) {
        List<Characteristic> characteristicList = new ArrayList<>();
        if (characteristicReqDtoList == null) {
            return characteristicList;
        }

        for (CharacteristicAddReqDto characteristicReqDto : characteristicReqDtoList) {
            characteristicList.add(characteristicReqDto.toEntity(projId));
        }
        return characteristicList;
    }
}
